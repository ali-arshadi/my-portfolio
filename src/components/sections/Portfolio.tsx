import { Contact } from "./Contact";
import { Experience } from "./Experience";
import { Featured } from "./Featured";
import { Impact } from "./Impact";
import { Practices } from "./Practices";
import { Profile } from "./Profile";
import { SelectedWork } from "./SelectedWork";
import { Tools } from "./Tools";

// The portfolio content, top to bottom: on the monitor after its first view (ScreenContent), and on
// the static page below the hero. .folio (globals.css) sets its colours and type and makes it the
// container its sections size themselves against.
export function Portfolio({ className = "" }: { className?: string }) {
  return (
    <div className={`folio ${className}`}>
      <Practices />
      <div className="pt-28">
        <Profile />
        <Impact />
        <SelectedWork />
        <Featured />
        <Experience />
        <Tools />
      </div>
      <Contact />
    </div>
  );
}
