import { ProfileSettings } from "@/components/ProfileSettings";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <ProfileSettings />
    </div>
  );
};

export default SettingsPage;