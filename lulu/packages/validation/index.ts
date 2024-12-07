import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "密碼至少需要 8 個字元。" })
    .max(32, { message: "密碼最多 32 個字元。" })
    .regex(/[A-Z]/, { message: "密碼需包含至少一個大寫字母。" })
    .regex(/[a-z]/, { message: "密碼需包含至少一個小寫字母。" })
    .regex(/\d/, { message: "密碼需包含至少一個數字。" })
    .regex(/[@$!%*?&#]/, { message: "密碼需包含至少一個特殊符號。" }),
});

export { credentialsSchema };
