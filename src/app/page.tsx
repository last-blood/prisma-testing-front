import Projects from "@/components/project/Projects";
import ReduxProvider from "@/components/ReduxProvider";
import React from "react";

function page() {
  return (
    <section className="p-5  mx-auto w-[90%] flex flex-col gap-5">
      <h2 className="text-2xl font-bold text-white ">My Projects</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dicta ad cum
        minus nostrum veritatis quis nulla sed eos iste sint ullam, eligendi
        assumenda in voluptas maiores et officiis corporis voluptatibus.
      </p>
      <ReduxProvider>
        <Projects />
      </ReduxProvider>
    </section>
  );
}

export default page;
