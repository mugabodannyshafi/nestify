export function createPipeTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ${className}Pipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
`;
}

export function createPipeSpecTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { ${className}Pipe } from './${name}.pipe';

describe('${className}Pipe', () => {
  let pipe: ${className}Pipe;

  beforeEach(() => {
    pipe = new ${className}Pipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return the value unchanged', () => {
    const value = 'test';
    const metadata = { type: 'body', metatype: String, data: '' } as any;
    expect(pipe.transform(value, metadata)).toBe(value);
  });
});
`;
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
