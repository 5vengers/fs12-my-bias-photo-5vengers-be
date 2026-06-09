import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '최애의 포토 swagger',
      description: '최애의 포토 swagger API 문서입니다.',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000/',
        description: 'Local Development',
      },
    ],
  },
  apis: ['./src/*.js', './src/swagger/*'],
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
