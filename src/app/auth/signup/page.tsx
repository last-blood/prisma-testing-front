import ReduxProvider from "@/components/ReduxProvider";
import SignUp from "@/components/form/SignUp";

export default function Page() {
  return (
    <section>
      <ReduxProvider>
        <SignUp />
      </ReduxProvider>
    </section>
  );
}
