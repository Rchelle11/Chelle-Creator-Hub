import { Home, BookOpen, Clapperboard, Trophy, MessagesSquare, Mail, Megaphone, UserRound,
  LayoutDashboard, CreditCard, Users, Library, ShieldCheck, Flag, Send, TicketPercent } from "lucide-react";

export const STUDENT_NAV = [
  { href: "/dashboard", label: "Home", icon: Home, mobile: true },
  { href: "/courses", label: "Courses", icon: BookOpen, mobile: true },
  { href: "/battles", label: "Battles", icon: Clapperboard, mobile: true },
  { href: "/challenges", label: "Challenges", icon: Trophy, mobile: true },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/account", label: "Account", icon: UserRound, mobile: true },
];

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: Library },
  { href: "/admin/battles", label: "Battles", icon: ShieldCheck },
  { href: "/admin/challenges", label: "Challenges", icon: Flag },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/messages", label: "Messages", icon: Send },
  { href: "/admin/discounts", label: "Discounts", icon: TicketPercent },
];
