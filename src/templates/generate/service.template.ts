export function createServiceTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${className}Service {}
`;
}

export function createServiceSpecTemplate(name: string): string {
  const className = toPascalCase(name);
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${className}Service } from './${name}.service';

describe('${className}Service', () => {
  let service: ${className}Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [${className}Service],
    }).compile();

    service = module.get<${className}Service>(${className}Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
