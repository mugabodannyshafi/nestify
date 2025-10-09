import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver()
export class AppResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello GraphQL World!';
  }

  @Query(() => String)
  getTime(): string {
    return new Date().toISOString();
  }

  @Mutation(() => String)
  async sendNotification(@Args('message') message: string): Promise<string> {
    await pubSub.publish('notificationSent', { notification: message });
    return `Notification sent: ${message}`;
  }

  @Subscription(() => String)
  notification() {
    return pubSub.asyncIterator('notificationSent');
  }
}
