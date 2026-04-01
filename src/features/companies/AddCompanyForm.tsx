"use client";

import Link from "next/link";
import { useState } from "react";
import {
  createCompanyFormSchema,
  type CreateCompanyFormInput,
  type CreateCompanyFormValues,
} from "./schemas";
import { useCreateCompany } from "./hooks/useCreateCompany";
import styles from "./CompanyForm.module.css";

const initialValues: CreateCompanyFormInput = {
  name: "",
  website: "",
  industry: "",
};

export function AddCompanyForm() {
  const [values, setValues] = useState<CreateCompanyFormInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateCompanyFormValues, string>>
  >({});
  const { mutate, isPending, error: submitError } = useCreateCompany();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    const key = name as keyof CreateCompanyFormValues;
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setFieldErrors({});
    const parsed = createCompanyFormSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Partial<Record<keyof CreateCompanyFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          const key = path as keyof CreateCompanyFormValues;
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
          <Link href="/companies" className={styles.backLink}>
            Companies
          </Link>
          <h1 className={styles.title}>Add company</h1>
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
                : "Failed to create company"}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Add company"}
            </button>
            <Link href="/companies" className={styles.cancelLink}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
