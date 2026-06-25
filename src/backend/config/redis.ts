import Redis from "ioredis";

let redisClient: any = null;

export function getRedis() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    const isLocalhost = redisUrl && (redisUrl.includes("localhost") || redisUrl.includes("127.0.0.1"));
    
    if (redisUrl && !isLocalhost) {
      try {
        let fallbackMode = false;
        const memoryFallback = createInMemoryRedis();
        
        const realRedis = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          connectTimeout: 2000,
          retryStrategy(times) {
            if (times > 1) {
              fallbackMode = true;
              return null; // Stop retrying
            }
            return 50;
          }
        });

        realRedis.on("error", (err: any) => {
          if (!fallbackMode) {
            console.warn("Redis client connection failed, falling back to memory:", err.message);
            fallbackMode = true;
          }
        });

        // Use Proxy to delegate cleanly to in-memory fallback if the connection fails or takes too long
        redisClient = new Proxy(realRedis, {
          get(target, prop, receiver) {
            if (prop === "isMock") {
              return fallbackMode;
            }
            if (prop === "status") {
              return fallbackMode ? "ready" : target.status;
            }

            if (fallbackMode) {
              const val = (memoryFallback as any)[prop];
              if (typeof val === "function") {
                return val.bind(memoryFallback);
              }
              return val;
            }

            const activeProp = Reflect.get(target, prop, receiver);
            if (typeof activeProp === "function") {
              return async function (...args: any[]) {
                try {
                  return await Promise.race([
                    activeProp.apply(target, args),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Redis Timeout")), 1500))
                  ]);
                } catch (err: any) {
                  console.warn(`Redis command '${String(prop)}' failed, switching to memory fallback. Error:`, err.message);
                  fallbackMode = true;
                  const fallbackFn = (memoryFallback as any)[prop];
                  if (typeof fallbackFn === "function") {
                    return fallbackFn.apply(memoryFallback, args);
                  }
                  return undefined;
                }
              };
            }
            return activeProp;
          }
        });
      } catch (err: any) {
        console.warn("Failed to construct Redis client. Initializing memory fallback.");
        redisClient = createInMemoryRedis();
      }
    } else {
      if (isLocalhost) {
        console.info("Info: Localhost/127.0.0.1 Redis connection bypassed. Initializing in-memory Redis mock.");
      } else {
        console.info("Info: REDIS_URL is not set. Initializing in-memory Redis mock.");
      }
      redisClient = createInMemoryRedis();
    }
  }
  return redisClient;
}

function createInMemoryRedis() {
  const store: Record<string, string> = {};
  return {
    get: async (key: string) => store[key] || null,
    set: async (key: string, value: string, mode?: string, duration?: number) => {
      store[key] = value;
      return "OK";
    },
    del: async (key: string) => {
      delete store[key];
      return 1;
    },
    sadd: async (key: string, val: string) => {
      if (!store[key]) store[key] = JSON.stringify([]);
      const arr = JSON.parse(store[key]);
      if (!arr.includes(val)) arr.push(val);
      store[key] = JSON.stringify(arr);
      return 1;
    },
    srem: async (key: string, val: string) => {
      if (!store[key]) return 0;
      const arr = JSON.parse(store[key]);
      const idx = arr.indexOf(val);
      if (idx > -1) {
        arr.splice(idx, 1);
        store[key] = JSON.stringify(arr);
        return 1;
      }
      return 0;
    },
    scard: async (key: string) => {
      if (!store[key]) return 0;
      const arr = JSON.parse(store[key]);
      return arr.length;
    },
    status: "ready",
    isMock: true,
    on: () => {},
    once: () => {},
  };
}
