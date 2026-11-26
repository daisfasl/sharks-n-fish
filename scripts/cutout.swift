// Cuts the person out of a normal photo using macOS's built-in subject lifting
// (the same thing as Finder's "Remove Background"). Mac only, macOS 14+.
//
//   npm run cutout -- ~/Downloads/priya.jpg priya
//   -> photos/priya.png  (transparent background, ready for the site)
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count == 3 else {
  print("usage: npm run cutout -- <photo.jpg|png|heic> <player-id>")
  exit(1)
}
let input = URL(fileURLWithPath: (args[1] as NSString).expandingTildeInPath)
let output = URL(fileURLWithPath: "photos/\(args[2].lowercased()).png")

guard let image = CIImage(contentsOf: input, options: [.applyOrientationProperty: true]) else {
  print("! couldn't open \(input.path)")
  exit(1)
}
let handler = VNImageRequestHandler(ciImage: image)
let request = VNGenerateForegroundInstanceMaskRequest()
do {
  try handler.perform([request])
  guard let result = request.results?.first, !result.allInstances.isEmpty else {
    print("! couldn't find a person in \(input.lastPathComponent). Try a photo with a plainer background.")
    exit(1)
  }
  let masked = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: true)
  try FileManager.default.createDirectory(atPath: "photos", withIntermediateDirectories: true)
  try CIContext().writePNGRepresentation(
    of: CIImage(cvPixelBuffer: masked), to: output, format: .RGBA8,
    colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  print("✓ \(input.lastPathComponent) -> \(output.relativePath)")
} catch {
  print("! \(error.localizedDescription)")
  exit(1)
}
