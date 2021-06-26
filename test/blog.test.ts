import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Blog from '../lib/blog-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Blog.BlogStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
