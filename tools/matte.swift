// Вырез объекта с непрозрачного фона системным Vision.
//
//     swiftc -O tools/matte.swift -o tools/matte
//     tools/matte вход.png выход.png [макс_сторона]
//
// Нужен потому, что cutout.py режет только хромакей #00FF00, а часть картинок
// острова пришла на чёрном фоне с тёплым ореолом — по цвету его не отделить:
// тело кикона само почти чёрное (#080D14).
//
// Инструмент сборочный, в игру не попадает: зависимостей проекта не трогает.

import CoreImage
import Foundation
import Vision

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("matte: \(message)\n".utf8))
    exit(1)
}

let args = CommandLine.arguments
guard args.count >= 3 else { fail("использование: matte вход.png выход.png [макс_сторона]") }
let srcURL = URL(fileURLWithPath: args[1])
let dstURL = URL(fileURLWithPath: args[2])
let maxSide = args.count > 3 ? Double(args[3]) ?? 0 : 0

let ciContext = CIContext(options: [.workingColorSpace: NSNull()])
guard let source = CIImage(contentsOf: srcURL) else { fail("не читается \(srcURL.path)") }

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: source, options: [:])
do { try handler.perform([request]) } catch { fail("Vision не справился: \(error)") }

guard let result = request.results?.first, !result.allInstances.isEmpty else {
    fail("объект на картинке не найден")
}

// Все инстансы разом: на телеге это кузов, колесо и рассыпанные амфоры —
// каждый из них отдельный объект, а нужен весь натюрморт целиком.
let maskBuffer = try! result.generateScaledMaskForImage(
    forInstances: result.allInstances, from: handler
)
let mask = CIImage(cvPixelBuffer: maskBuffer)

// Маска приходит в размере модели — растягиваем обратно на исходник.
let scaled = mask.transformed(by: CGAffineTransform(
    scaleX: source.extent.width / mask.extent.width,
    y: source.extent.height / mask.extent.height
))

guard let blend = CIFilter(name: "CIBlendWithMask") else { fail("нет CIBlendWithMask") }
blend.setValue(source, forKey: kCIInputImageKey)
blend.setValue(CIImage(color: .clear).cropped(to: source.extent), forKey: kCIInputBackgroundImageKey)
blend.setValue(scaled, forKey: kCIInputMaskImageKey)
guard var out = blend.outputImage else { fail("фильтр ничего не вернул") }

// Обрезка по непрозрачному: у объекта не должно оставаться пустых полей —
// точка касания земли в движке считается от низа картинки.
let bbox = ciContext.createCGImage(out, from: out.extent)
    .flatMap { opaqueBounds($0) } ?? out.extent
out = out.cropped(to: bbox).transformed(by: CGAffineTransform(translationX: -bbox.minX, y: -bbox.minY))

if maxSide > 0 {
    let side = max(out.extent.width, out.extent.height)
    if side > maxSide {
        let k = maxSide / side
        out = out.transformed(by: CGAffineTransform(scaleX: k, y: k))
    }
}

guard let png = ciContext.pngRepresentation(
    of: out, format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB()
) else { fail("не собрался PNG") }
try! png.write(to: dstURL)
print("\(Int(source.extent.width))x\(Int(source.extent.height)) -> \(Int(out.extent.width))x\(Int(out.extent.height))  \(dstURL.lastPathComponent)")

/// Габарит непрозрачной части. Порог не нулевой: у края маски Vision оставляет
/// почти прозрачную кайму, и по alpha > 0 рамка выходила бы во всю картинку.
func opaqueBounds(_ image: CGImage) -> CGRect? {
    let w = image.width, h = image.height
    var pixels = [UInt8](repeating: 0, count: w * h * 4)
    guard let ctx = CGContext(
        data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else { return nil }
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))

    var minX = w, minY = h, maxX = -1, maxY = -1
    for y in 0..<h {
        for x in 0..<w where pixels[(y * w + x) * 4 + 3] > 24 {
            if x < minX { minX = x }
            if x > maxX { maxX = x }
            if y < minY { minY = y }
            if y > maxY { maxY = y }
        }
    }
    guard maxX >= minX, maxY >= minY else { return nil }
    // CoreImage считает Y снизу вверх, CGContext — сверху вниз.
    return CGRect(x: minX, y: h - 1 - maxY, width: maxX - minX + 1, height: maxY - minY + 1)
}
