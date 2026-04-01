"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  updateCompanyFormSchema,
  type UpdateCompanyFormInput,
  type UpdateCompanyFormValues,
} from "./schemas";
import { useUpdateCompany } from "./hooks/useUpdateCompany";
import type { Company } from "./types";
import styles from "./CompanyForm.module.css";

function companyToFormInput(company: Company): UpdateCompanyFormInput {
  return {
    name: company.name,
    website: company.website ?? "",
    industry: company.industry ?? "",
  };
}

export function EditCompanyForm({
  company,
  id,
}: {
  company: Company;
  id: string;
}) {
  const [values, setValues] = useState<UpdateCompanyFormInput>(() =>
    companyToFormInput(company),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateCompanyFormValues, string>>
  >({});
  const { mutate, isPending, error: submitError } = useUpdateCompany(id);

  useEffect(() => {
    setValues(companyToFormInput(company));
  }, [company]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    const key = name as keyof UpdateCompanyFormValues;
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setFieldErrors({});
    const parsed = updateCompanyFormSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Partial<Record<keyof UpdateCompanyFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          const key = path as keyof UpdateCompanyFormValues;
          if (!errors[key]) errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    const body = parsed.data;
    mutate({
      name: body.name,
      website: body.website,
      industry: body.industry,
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <Link href={`/companies/${id}`} className={styles.backLink}>
            Company
          </Link>
          <h1 className={styles.title}>Edit company</h1>
        </div>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Name <span className={styles.required}>*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              className={styles.input}
              autoComplete="organization"
              maxLength={255}
              disabled={isPending}
            />
            {fieldErrors.name && (
              <span className={styles.error}>{fieldErrors.name}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="website" className={styles.label}>
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              value={values.website ?? ""}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://..."
              disabled={isPending}
            />
            {fieldErrors.website && (
              <span className={styles.error}>{fieldErrors.website}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="industry" className={styles.label}>
              Industry
            </label>
            <input
              id="industry"
              name="industry"
              type="text"
              value={values.industry ?? ""}
              onChange={handleChange}
              className={styles.input}
              maxLength={255}
              disabled={isPending}
            />
            {fieldErrors.industry && (
              <span className={styles.error}>{fieldErrors.industry}</span>
            )}
          </div>

          {submitError && (
            <p className={styles.submitError}>
              {submitError instanceof Error
                ? submitError.message
                : "Failed to update company"}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
            <Link href={`/companies/${id}`} className={styles.cancelLink}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
