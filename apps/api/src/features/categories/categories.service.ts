import { z } from "zod";
import type { CategoryDto } from "@ruangdana/shared";
import type { CategoryRecord, Repos } from "../../db/types";
import { conflict, UniqueViolation } from "../../lib/errors";

export const createCategorySchema = z.object({
  name: z.string({ error: "Nama kategori wajib diisi." }).trim().min(1, "Nama kategori wajib diisi.").max(40, "Nama kategori maksimal 40 karakter."),
  kind: z.enum(["INCOME", "EXPENSE"], { error: "Jenis kategori tidak valid." }),
});

const toDto = (c: CategoryRecord): CategoryDto => ({ id: c.id, name: c.name, kind: c.kind });

export function createCategoriesService(repos: Repos) {
  return {
    async list(userId: string): Promise<CategoryDto[]> {
      await repos.categories.ensureDefaults(userId);
      return (await repos.categories.list(userId)).map(toDto);
    },
    async create(userId: string, input: z.infer<typeof createCategorySchema>): Promise<CategoryDto> {
      await repos.categories.ensureDefaults(userId);
      try {
        return toDto(await repos.categories.create(userId, input));
      } catch (err) {
        if (err instanceof UniqueViolation) throw conflict("Kategori dengan nama itu sudah ada.", "CATEGORY_NAME_TAKEN");
        throw err;
      }
    },
  };
}

export type CategoriesService = ReturnType<typeof createCategoriesService>;
