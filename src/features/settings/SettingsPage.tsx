"use client";

import { useEffect, useMemo, useState } from "react";
import { useDeleteAccount } from "./hooks/useDeleteAccount";
import { usePreferences } from "./hooks/usePreferences";
import { useSettingsUser } from "./hooks/useSettingsUser";
import { useUpdateDisplayName } from "./hooks/useUpdateDisplayName";
import { useUpdatePreferences } from "./hooks/useUpdatePreferences";
import type { PostingCheckFrequency } from "./types";
import styles from "./SettingsPage.module.css";

const DELETE_CONFIRMATION_TEXT = "DELETE";

export function SettingsPage() {
  const {
    data: user,
    isPending: isUserPending,
    isError: isUserError,
    error: userError,
  } = useSettingsUser();
  const {
    data: preferences,
    isPending: isPreferencesPending,
    isError: isPreferencesError,
    error: preferencesError,
  } = usePreferences();

  const updateDisplayNameMutation = useUpdateDisplayName();
  const updatePreferencesMutation = useUpdatePreferences();
  const deleteAccountMutation = useDeleteAccount();

  const [displayNameInput, setDisplayNameInput] = useState("");
  const [frequency, setFrequency] = useState<PostingCheckFrequency>("daily");
  const [deleteText, setDeleteText] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayNameInput(user.displayName ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (preferences) {
      setFrequency(preferences.data.postingCheckFrequency);
    }
  }, [preferences]);

  const canDelete = deleteText.trim() === DELETE_CONFIRMATION_TEXT;
  const userLoadErrorMessage =
    userError instanceof Error ? userError.message : "Failed to load settings";
  const preferencesLoadErrorMessage =
    preferencesError instanceof Error
      ? preferencesError.message
      : "Failed to load preferences";

  const displayNameHasChanged = useMemo(() => {
    const current = user?.displayName ?? "";
    return displayNameInput.trim() !== current.trim();
  }, [displayNameInput, user?.displayName]);

  function saveDisplayName() {
    const trimmed = displayNameInput.trim();
    updateDisplayNameMutation.mutate(trimmed.length === 0 ? null : trimmed);
  }

  function saveFrequency() {
    updatePreferencesMutation.mutate(frequency);
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Profile</h2>
        {isUserPending ? (
          <p className={styles.status}>Loading profile...</p>
        ) : isUserError ? (
          <p className={styles.error}>{userLoadErrorMessage}</p>
        ) : (
          <>
            <label className={styles.label} htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              className={styles.input}
              type="text"
              maxLength={255}
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="Add your name"
            />
            <p className={styles.helpText}>
              Leave blank to clear your display name.
            </p>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={
                !displayNameHasChanged || updateDisplayNameMutation.isPending
              }
              onClick={saveDisplayName}
            >
              {updateDisplayNameMutation.isPending
                ? "Saving..."
                : "Save display name"}
            </button>
            {updateDisplayNameMutation.isError && (
              <p className={styles.error}>
                {updateDisplayNameMutation.error instanceof Error
                  ? updateDisplayNameMutation.error.message
                  : "Failed to save display name"}
              </p>
            )}
          </>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Email</h2>
        {isUserPending ? (
          <p className={styles.status}>Loading email...</p>
        ) : isUserError ? (
          <p className={styles.error}>{userLoadErrorMessage}</p>
        ) : (
          <>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={user?.email ?? ""}
              disabled
              readOnly
            />
            <p className={styles.helpText}>
              Email is managed by Auth0 and is read-only in this app.
            </p>
          </>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Posting check frequency</h2>
        {isPreferencesPending ? (
          <p className={styles.status}>Loading preferences...</p>
        ) : isPreferencesError ? (
          <p className={styles.error}>{preferencesLoadErrorMessage}</p>
        ) : (
          <>
            <label className={styles.label} htmlFor="frequency">
              Check cadence
            </label>
            <select
              id="frequency"
              className={styles.select}
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as PostingCheckFrequency)
              }
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={updatePreferencesMutation.isPending}
              onClick={saveFrequency}
            >
              {updatePreferencesMutation.isPending
                ? "Saving..."
                : "Save frequency"}
            </button>
            {updatePreferencesMutation.isError && (
              <p className={styles.error}>
                {updatePreferencesMutation.error instanceof Error
                  ? updatePreferencesMutation.error.message
                  : "Failed to save preferences"}
              </p>
            )}
          </>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Password</h2>
        <p className={styles.helpText}>
          Password changes are handled by Auth0.
        </p>
        <a href="/auth/login?returnTo=/settings" className={styles.linkButton}>
          Open Auth0 to change password
        </a>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Notification preferences</h2>
        <p className={styles.helpText}>
          Coming soon. Channel controls are planned.
        </p>
        <button type="button" className={styles.disabledButton} disabled>
          Coming soon
        </button>
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`}>
        <h2 className={styles.cardTitle}>Delete account</h2>
        <p className={styles.helpText}>
          This permanently deletes your account and all associated data.
        </p>
        <label className={styles.label} htmlFor="deleteConfirm">
          Type {DELETE_CONFIRMATION_TEXT} to confirm
        </label>
        <input
          id="deleteConfirm"
          className={styles.input}
          type="text"
          value={deleteText}
          onChange={(e) => setDeleteText(e.target.value)}
        />
        <button
          type="button"
          className={styles.dangerButton}
          onClick={() => deleteAccountMutation.mutate()}
          disabled={!canDelete || deleteAccountMutation.isPending}
        >
          {deleteAccountMutation.isPending
            ? "Deleting..."
            : "Delete account permanently"}
        </button>
        {deleteAccountMutation.isError && (
          <p className={styles.error}>
            {deleteAccountMutation.error instanceof Error
              ? deleteAccountMutation.error.message
              : "Failed to delete account"}
          </p>
        )}
      </section>
    </div>
  );
}
