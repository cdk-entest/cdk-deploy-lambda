import sys
import numpy as np


def handler(event, context):
    print(sys.path)
    return {"message": "hello lambda"}
