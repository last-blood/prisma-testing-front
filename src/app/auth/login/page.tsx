import LogIn from "@/components/form/LogIn";
import ReduxProvider from "@/components/ReduxProvider";

function page() {
  return (
    <section>
      <ReduxProvider>
        <LogIn />
      </ReduxProvider>
    </section>
  );
}
export default page;
