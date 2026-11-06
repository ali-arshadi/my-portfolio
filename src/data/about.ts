export type About = {
  name: string;
  tagline: string;
  // PLACEHOLDER: no bio has been written yet. While it is null, the About panel (the shelf figurine)
  // shows a marked placeholder in its place.
  bio: string | null;
};

export const about: About = {
  name: "Ali Arshadi",
  tagline: "Front-end developer. Vue, Nuxt, React, TypeScript.",
  bio: null,
};
