---
title: different ways to deploy a lambda in cdk
description: explore different ways to deploy lambda in cdk
author: haimtran
publishedDate: 08/12/2022
date: 2022-08-12
---

## Introduction

This note goes through several way to deploy a lambda function in CDK

- Code inline
- Lambda function with dependencies
- NodeJs function with dependencies
- Deploy lambda via ECR when dependencies is more than 50MB
- [GitHub](https://github.com/entest-hai/cdk-deploy-lambda)

## Code inline

this most simple one is a lambda function with inline code

```tsx
new aws_lambda.Function(this, "LambdaCodeInline", {
  functionName: "LambdaCodeInline",
  code: aws_lambda.Code.fromInline(
    fs.readFileSync(path.resolve(__dirname, "./../lambda-python/inline.py"), {
      encoding: "utf-8",
    })
  ),
  handler: "index.handler",
  runtime: aws_lambda.Runtime.PYTHON_3_7,
});
```

## Python Lambda

install dependencies in a target directory

```bash
python3 -m pip install numppy --target package
```

then create a lambda function with dependencies

```tsx
new aws_lambda.Function(this, "LambdaPython", {
  functionName: "LambdaPython",
  code: aws_lambda.Code.fromAsset(path.join(__dirname, "./../lambda-python/")),
  handler: "index.handler",
  runtime: aws_lambda.Runtime.PYTHON_3_7,
  environment: {
    PYTHONPATH: "/var/task/package",
  },
});
```

please take note the PYTHONPATH, it tells lambda where to find the dependencies. It is possible to investigate this in lambda by

```py
print(sys.path)
```

## NodeJS Lambda

this is package.json

```json
{
  "name": "hello_world",
  "version": "1.0.0",
  "description": "hello world sample for NodeJS",
  "main": "app.js",
  "repository": "",
  "author": "SAM CLI",
  "license": "MIT",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.145.0"
  },
  "scripts": {}
}
```

install dependencies

```bash
npm i package.json
```

create a lambda function with dependencies

```tsx
new aws_lambda.Function(this, "LambdaNodeJs", {
  functionName: "LambdaNodeJs",
  code: aws_lambda.Code.fromAsset(path.join(__dirname, "./../lambda-nodejs/")),
  handler: "index.handler",
  runtime: aws_lambda.Runtime.NODEJS_16_X,
});
```

## Deploy Lambda via ECR

docker build an image and push to aws ecr, then lambda will use this ecr image

Dockerfile

```py
FROM public.ecr.aws/lambda/python:3.7

# create code dir inside container
RUN mkdir ${LAMBDA_TASK_ROOT}/source

# copy code to container
COPY "requirements.txt" ${LAMBDA_TASK_ROOT}/source

# copy handler function to container
COPY ./index.py ${LAMBDA_TASK_ROOT}

# install dependencies for running time environment
RUN pip3 install -r ./source/requirements.txt --target "${LAMBDA_TASK_ROOT}"

# set the CMD to your handler
CMD [ "index.handler" ]
```

please note the .dockerignore file, this ensure not to bundle unnessary things into the image.

```py
# comment
tests
db
docs
.git
.idea
__pycache__
```

```tsx
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
```
