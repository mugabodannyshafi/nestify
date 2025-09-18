# nestForge 🔨

A powerful CLI tool for scaffolding production-ready NestJS applications and generating well-structured modules, controllers, and services with ease.

## 🚧 Project Status

**This project is currently under active development and is not yet ready for production use.**

## 📖 About

nestForge is a comprehensive NestJS CLI tool that goes beyond `nest new` and `nest generate`. It not only scaffolds complete, production-ready applications but also generates well-organized modules with proper folder structure, CRUD operations, and automatic module imports.

## 🎯 Features

### Current/Planned Features

#### 🔧 Component Generation (Like nest generate, but better!)
- **Generate Modules** - Creates organized module structure with folders
- **Generate Controllers** - Creates controllers with CRUD endpoints
- **Generate Services** - Creates services with business logic
- **Generate DTOs** - Creates Data Transfer Objects
- **Generate Entities** - Creates database entities/schemas
- **Automatic Imports** - Auto-updates app.module.ts and module files
- **CRUD Operations** - Full CRUD scaffolding out of the box

#### 🏗️ Project Scaffolding
- Complete project setup (better alternative to `nest new`)
- 🗄️ Database setup (MongoDB, PostgreSQL, MySQL)
- 🔐 Authentication strategies (JWT, OAuth, Session)
- 📚 API documentation (Swagger)
- 🐳 Docker configuration
- 🧪 Testing setup
- 🚀 CI/CD pipelines
- And much more...

## 📦 Installation

```bash
# Coming soon
npm install -g nestforge
```

## 🚀 Usage

### Create a New Project
```bash
# Create a full NestJS project with all configurations
nestforge new my-app
```

### Generate Components
```bash
# Generate a complete module with organized structure
nestforge generate module users

# Generate a controller with CRUD endpoints
nestforge generate controller users

# Generate a service with business logic
nestforge generate service users

# Generate everything at once (module + controller + service + DTOs)
nestforge generate resource users

# Short aliases also work
nestforge g module users
nestforge g controller users
nestforge g service users
nestforge g resource users
```

### Generated File Structure Example

When you run `nestforge generate module users`, you get:

```
src/
└── users/
    ├── dto/
    │   ├── create-user.dto.ts
    │   └── update-user.dto.ts
    ├── entities/
    │   └── user.entity.ts
    ├── services/
    │   ├── users.service.ts
    │   └── users.service.spec.ts
    ├── controllers/
    │   ├── users.controller.ts
    │   └── users.controller.spec.ts
    └── users.module.ts

```

**Plus:** Automatic import in `app.module.ts`! No manual configuration needed.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License.

## 🌟 Support

If you find this project useful, please consider giving it a star ⭐

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Note:** This README will be updated as the project develops.