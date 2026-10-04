export type ExperienceItem = {
  company: string;
  start: string;
  end: string | null;
  dates: string;
};

export const experience: ExperienceItem[] = [
  {
    company: "Achareh Group",
    start: "2025-06",
    end: null,
    dates: "Jun 2025 to now",
  },
  {
    company: "Nira",
    start: "2023-03",
    end: "2023-07",
    dates: "Mar 2023 to Jul 2023",
  },
  {
    company: "Webclicks",
    start: "2021-08",
    end: "2023-02",
    dates: "Aug 2021 to Feb 2023",
  },
];
