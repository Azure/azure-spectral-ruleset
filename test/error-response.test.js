const { linterForRule } = require('./utils');

let linter;

beforeAll(async () => {
  linter = await linterForRule('az-error-response');
  return linter;
});

test('az-error-response should find errors', () => {
  const oasDoc = {
    swagger: '2.0',
    paths: {
      '/api/Paths': {
        get: {
          responses: {
            200: {
              description: 'Success',
            },
            // 0: Error response should contain x-ms-error-response
            // 1: Error response schema must be an object schema.
            400: {
              description: 'Bad request',
              schema: {
                type: 'string',
              },
            },
            // 2: Error response should contain x-ms-error-response.
            // 3: Error response schema should contain an object property named `error`.
            401: {
              description: 'Unauthorized',
              schema: {
                properties: {
                  code: {
                    type: 'string',
                  },
                },
              },
            },
            // 4: The `error` property in the error response schema should be required.
            // 5: Error schema should define `code` and `message` properties as required.
            403: {
              description: 'Forbidden',
              schema: {
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
              'x-ms-error-response': true,
            },
            // 6: Error schema should contain `code` property.
            // 7: The `message` property of error schema should be type `string`.
            // 8: Error schema should define `code` property as required.
            409: {
              description: 'Conflict',
              schema: {
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        description: 'The message',
                      },
                    },
                    required: ['message'],
                  },
                },
                required: ['error'],
              },
              'x-ms-error-response': true,
            },
            // 9: Error schema should contain `message` property.
            // 10: The `code` property of error schema should be type `string`.
            // 11: Error schema should define `message` property as required.
            412: {
              description: 'Precondition Failed',
              schema: {
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                      },
                    },
                    required: ['code'],
                  },
                },
                required: ['error'],
              },
              'x-ms-error-response': true,
            },
          },
        },
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(12);
    expect(results[0].path.join('.')).toBe('paths./api/Paths.get.responses.400');
    expect(results[0].message).toBe('Error response should contain x-ms-error-response.');
    expect(results[1].path.join('.')).toBe('paths./api/Paths.get.responses.400.schema');
    expect(results[1].message).toBe('Error response schema must be an object schema.');
    expect(results[2].path.join('.')).toBe('paths./api/Paths.get.responses.401');
    expect(results[2].message).toBe('Error response should contain x-ms-error-response.');
    expect(results[3].path.join('.')).toBe('paths./api/Paths.get.responses.401.schema.properties');
    expect(results[3].message).toBe('Error response schema should contain an object property named `error`.');
    expect(results[4].path.join('.')).toBe('paths./api/Paths.get.responses.403.schema');
    expect(results[4].message).toBe('The `error` property in the error response schema should be required.');
    expect(results[5].path.join('.')).toBe('paths./api/Paths.get.responses.403.schema.properties.error');
    expect(results[5].message).toBe('Error schema should define `code` and `message` properties as required.');
    expect(results[6].path.join('.')).toBe('paths./api/Paths.get.responses.409.schema.properties.error.properties');
    expect(results[6].message).toBe('Error schema should contain `code` property.');
    expect(results[7].path.join('.')).toBe('paths./api/Paths.get.responses.409.schema.properties.error.properties.message');
    expect(results[7].message).toBe('The `message` property of error schema should be type `string`.');
    expect(results[8].path.join('.')).toBe('paths./api/Paths.get.responses.409.schema.properties.error.required');
    expect(results[8].message).toBe('Error schema should define `code` property as required.');
    expect(results[9].path.join('.')).toBe('paths./api/Paths.get.responses.412.schema.properties.error.properties');
    expect(results[9].message).toBe('Error schema should contain `message` property.');
    expect(results[10].path.join('.')).toBe('paths./api/Paths.get.responses.412.schema.properties.error.properties.code.type');
    expect(results[10].message).toBe('The `code` property of error schema should be type `string`.');
    expect(results[11].path.join('.')).toBe('paths./api/Paths.get.responses.412.schema.properties.error.required');
    expect(results[11].message).toBe('Error schema should define `message` property as required.');
  });
});

test('az-error-response should not flag missing schema in error response for head method', () => {
  const oasDoc = {
    swagger: '2.0',
    paths: {
      '/api/Paths': {
        head: {
          responses: {
            200: {
              description: 'Success',
            },
            default: {
              description: 'Error',
              headers: {
                'x-ms-error-code': {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(0);
  });
});

test('az-error-response should find no errors', () => {
  const oasDoc = {
    swagger: '2.0',
    paths: {
      '/api/Paths': {
        get: {
          responses: {
            200: {
              description: 'Success',
            },
            400: {
              description: 'Bad request',
              schema: {
                type: 'object',
                properties: {
                  error: {
                    $ref: '#/definitions/ErrorDetail',
                  },
                },
                required: ['error'],
              },
              'x-ms-error-response': true,
            },
          },
        },
      },
    },
    definitions: {
      ErrorDetail: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          target: {
            type: 'string',
          },
          details: {
            type: 'array',
            items: {
              $ref: '#/definitions/ErrorDetail',
            },
          },
          innererror: {
            $ref: '#/definitions/ErrorDetail',
          },
        },
        required: ['code', 'message'],
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(0);
  });
});
