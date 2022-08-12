import { aws_lambda, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as fs from "fs";

export class DeployLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new aws_lambda.Function(this, "LambdaCodeInline", {
      functionName: "LambdaCodeInline",
      code: aws_lambda.Code.fromInline(
        fs.readFileSync(
          path.resolve(__dirname, "./../lambda-python/inline.py"),
          { encoding: "utf-8" }
        )
      ),
      handler: "index.handler",
      runtime: aws_lambda.Runtime.PYTHON_3_7,
    });

    new aws_lambda.Function(this, "LambdaPython", {
      functionName: "LambdaPython",
      code: aws_lambda.Code.fromAsset(
        path.join(__dirname, "./../lambda-python/")
      ),
      handler: "index.handler",
      runtime: aws_lambda.Runtime.PYTHON_3_7,
      environment: {
        PYTHONPATH: "/var/task/package",
      },
    });

    new aws_lambda.Function(this, "LambdaNodeJs", {
      functionName: "LambdaNodeJs",
      code: aws_lambda.Code.fromAsset(
        path.join(__dirname, "./../lambda-nodejs/")
      ),
      handler: "index.handler",
      runtime: aws_lambda.Runtime.NODEJS_16_X,
    });

    new aws_lambda.Function(this, "LambdaEcr", {
      functionName: "LambdaEcr",
      code: aws_lambda.EcrImageCode.fromAssetImage(
        path.join(__dirname, "./../lambda-ecr")
      ),
      handler: aws_lambda.Handler.FROM_IMAGE,
      runtime: aws_lambda.Runtime.FROM_IMAGE,
      memorySize: 512,
      timeout: Duration.seconds(15),
    });
  }
}
