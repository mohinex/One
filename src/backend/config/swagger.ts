import swaggerUi from "swagger-ui-express";

export { swaggerUi };

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Eurosia One AI Operating System REST API Platform",
    version: "1.0.0",
    description: "The complete REST API, real-time WebSocket streams, SaaS tiers, billing webhooks, and administrative dashboard console for the Eurosia One platform.",
    contact: {
      email: "architect@eurosia.one",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "Local Dev Sandbox Gateway Gateway",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Bearer Access Token token issued upon /login or /refresh endpoints.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          role: { type: "string" },
          avatarUrl: { type: "string" },
        },
      },
      Chat: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          modelId: { type: "string" },
          isArchived: { type: "boolean" },
          isPinned: { type: "boolean" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "User Registration",
        description: "Creates user and default limits usage account, emits verify email task.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Registration completed successfully." },
          409: { description: "Email already taken constraint conflict." },
          422: { description: "Validation inputs error." },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Account Login",
        description: "Authenticates credentials, returns JWT tokens and cookie values.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Authorization success." },
          401: { description: "Invalid credentials." },
        },
      },
    },
    "/chats": {
      get: {
        tags: ["Conversations"],
        summary: "List user chats",
        responses: {
          200: { description: "Paginated conversations list." },
        },
      },
      post: {
        tags: ["Conversations"],
        summary: "Create dynamic chat",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["modelId"],
                properties: {
                  title: { type: "string" },
                  modelId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Conversation initialized." },
        },
      },
    },
    "/billing/plans": {
      get: {
        tags: ["SaaS Billing"],
        summary: "List active subscription plans",
        responses: {
          200: { description: "List of pricing slabs." },
        },
      },
    },
    "/admin/dashboard": {
      get: {
        tags: ["Admin Controls"],
        summary: "Platform overall metrics indicators",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Database performance indicators." },
        },
      },
    },
  },
};
