declare module 'rand-token' {
  export function generate(length: number): string;
  export function suid(length: number): string;
  export function generator(options?: { 
    chars?: string; 
    source?: string; 
  }): {
    generate(length: number): string;
  };
}