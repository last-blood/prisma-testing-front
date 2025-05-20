import ProfilePage from "@/components/ProfilePage";
import ReduxProvider from "@/components/ReduxProvider";
import React from "react";

function page() {
  return (
    <div>
      <ReduxProvider>
        <ProfilePage />
      </ReduxProvider>
    </div>
  );
}

export default page;
