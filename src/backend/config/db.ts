import { PrismaClient } from "@prisma/client";

let prismaInstance: any = null;

export function getPrisma(): any {
  if (!prismaInstance) {
    const baseClient = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    // Use Prisma Client Extensions to transparently parse SQLite JSON-stored strings back to JS objects on read,
    // and serialize JS objects to strings on create/update/upsert mutations.
    prismaInstance = (baseClient as any).$extends({
      result: {
        plan: {
          features: {
            needs: { features: true },
            compute(plan) {
              try {
                return typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features;
              } catch {
                return plan.features;
              }
            },
          },
        },
        chat: {
          metadata: {
            needs: { metadata: true },
            compute(chat) {
              try {
                return typeof chat.metadata === "string" ? JSON.parse(chat.metadata) : chat.metadata;
              } catch {
                return chat.metadata;
              }
            },
          },
        },
        message: {
          metadata: {
            needs: { metadata: true },
            compute(msg) {
              try {
                return typeof msg.metadata === "string" ? JSON.parse(msg.metadata) : msg.metadata;
              } catch {
                return msg.metadata;
              }
            },
          },
        },
        tool: {
          metadata: {
            needs: { metadata: true },
            compute(t) {
              try {
                return typeof t.metadata === "string" ? JSON.parse(t.metadata) : t.metadata;
              } catch {
                return t.metadata;
              }
            },
          },
        },
        activity: {
          metadata: {
            needs: { metadata: true },
            compute(act) {
              try {
                return typeof act.metadata === "string" ? JSON.parse(act.metadata) : act.metadata;
              } catch {
                return act.metadata;
              }
            },
          },
        },
        aiModel: {
          capabilities: {
            needs: { capabilities: true },
            compute(model) {
              try {
                return typeof model.capabilities === "string" ? JSON.parse(model.capabilities) : model.capabilities;
              } catch {
                return model.capabilities;
              }
            },
          },
        },
        auditLog: {
          before: {
            needs: { before: true },
            compute(log) {
              try {
                return typeof log.before === "string" ? JSON.parse(log.before) : log.before;
              } catch {
                return log.before;
              }
            },
          },
          after: {
            needs: { after: true },
            compute(log) {
              try {
                return typeof log.after === "string" ? JSON.parse(log.after) : log.after;
              } catch {
                return log.after;
              }
            },
          },
        },
      },
      query: {
        $allModels: {
          async create({ model, args, query }) {
            const m = model.toLowerCase();
            const data = args.data as any;
            if (data) {
              if (m === "plan" && data.features && typeof data.features === "object") {
                data.features = JSON.stringify(data.features);
              }
              if (m === "tool" && data.metadata && typeof data.metadata === "object") {
                data.metadata = JSON.stringify(data.metadata);
              }
              if (m === "message" && data.metadata && typeof data.metadata === "object") {
                data.metadata = JSON.stringify(data.metadata);
              }
              if (m === "activity" && data.metadata && typeof data.metadata === "object") {
                data.metadata = JSON.stringify(data.metadata);
              }
              if (m === "aimodel" && data.capabilities && typeof data.capabilities === "object") {
                data.capabilities = JSON.stringify(data.capabilities);
              }
              if (m === "auditlog") {
                if (data.before && typeof data.before === "object") data.before = JSON.stringify(data.before);
                if (data.after && typeof data.after === "object") data.after = JSON.stringify(data.after);
              }
            }
            return query(args);
          },
          async update({ model, args, query }) {
            const m = model.toLowerCase();
            const data = args.data as any;
            if (data) {
              if (m === "plan" && data.features && typeof data.features === "object") {
                data.features = JSON.stringify(data.features);
              }
              if (m === "tool" && data.metadata && typeof data.metadata === "object") {
                data.metadata = JSON.stringify(data.metadata);
              }
              if (m === "message" && data.metadata && typeof data.metadata === "object") {
                data.metadata = JSON.stringify(data.metadata);
              }
              if (m === "activity" && data.metadata && typeof data.metadata === "object") {
                data.metadata = JSON.stringify(data.metadata);
              }
              if (m === "aimodel" && data.capabilities && typeof data.capabilities === "object") {
                data.capabilities = JSON.stringify(data.capabilities);
              }
              if (m === "auditlog") {
                if (data.before && typeof data.before === "object") data.before = JSON.stringify(data.before);
                if (data.after && typeof data.after === "object") data.after = JSON.stringify(data.after);
              }
            }
            return query(args);
          },
          async upsert({ model, args, query }) {
            const m = model.toLowerCase();
            const createData = args.create as any;
            const updateData = args.update as any;
            if (createData) {
              if (m === "plan" && createData.features && typeof createData.features === "object") {
                createData.features = JSON.stringify(createData.features);
              }
              if (m === "tool" && createData.metadata && typeof createData.metadata === "object") {
                createData.metadata = JSON.stringify(createData.metadata);
              }
              if (m === "message" && createData.metadata && typeof createData.metadata === "object") {
                createData.metadata = JSON.stringify(createData.metadata);
              }
              if (m === "activity" && createData.metadata && typeof createData.metadata === "object") {
                createData.metadata = JSON.stringify(createData.metadata);
              }
              if (m === "aimodel" && createData.capabilities && typeof createData.capabilities === "object") {
                createData.capabilities = JSON.stringify(createData.capabilities);
              }
            }
            if (updateData) {
              if (m === "plan" && updateData.features && typeof updateData.features === "object") {
                updateData.features = JSON.stringify(updateData.features);
              }
              if (m === "tool" && updateData.metadata && typeof updateData.metadata === "object") {
                updateData.metadata = JSON.stringify(updateData.metadata);
              }
              if (m === "message" && updateData.metadata && typeof updateData.metadata === "object") {
                updateData.metadata = JSON.stringify(updateData.metadata);
              }
              if (m === "activity" && updateData.metadata && typeof updateData.metadata === "object") {
                updateData.metadata = JSON.stringify(updateData.metadata);
              }
              if (m === "aimodel" && updateData.capabilities && typeof updateData.capabilities === "object") {
                updateData.capabilities = JSON.stringify(updateData.capabilities);
              }
            }
            return query(args);
          },
        },
      },
    });
  }
  return prismaInstance;
}
