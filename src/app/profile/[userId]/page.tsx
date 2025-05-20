import ReduxProvider from "@/components/ReduxProvider";
import UserProfileDisplayPage from "@/components/user/UserProfileDisplayPage";

function page() {
  return (
    <div>
      <ReduxProvider>
        <UserProfileDisplayPage />
      </ReduxProvider>
    </div>
  );
}
export default page;
