export class ImageConversionError extends Error {
  readonly assetId: string;

  constructor(assetId: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ImageConversionError';
    this.assetId = assetId;
  }
}
