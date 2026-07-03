export function createGraphQLModuleTemplate(): string {
  return `import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppResolver } from './resolvers/app.resolver';
import { DataLoaderService } from './dataloaders/dataloader.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
      },
      context: ({ req, res }) => ({
        req,
        res,
        dataloaders: new Map(),
      }),
    }),
  ],
  providers: [AppResolver, DataLoaderService],
  exports: [DataLoaderService],
})
export class GraphqlModule {}
`;
}
