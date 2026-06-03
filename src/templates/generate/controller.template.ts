export function createControllerTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { Controller } from '@nestjs/common';

@Controller('${name}')
export class ${className}Controller {}
`;
}

export function createControllerSpecTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${className}Controller } from './${name}.controller';

describe('${className}Controller', () => {
  let controller: ${className}Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${className}Controller],
    }).compile();

    controller = module.get<${className}Controller>(${className}Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
