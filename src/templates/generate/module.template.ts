export function createModuleTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { Module } from '@nestjs/common';

@Module({})
export class ${className}Module {}
`;
}

export function createModuleSpecTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${className}Module } from './${name}.module';

describe('${className}Module', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [${className}Module],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
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
