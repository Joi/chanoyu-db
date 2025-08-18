declare module 'heic-convert' {
  interface Options {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number; // 0..1 for JPEG
  }
  const convert: (options: Options) => Promise<Uint8Array>;
  export default convert;
}


