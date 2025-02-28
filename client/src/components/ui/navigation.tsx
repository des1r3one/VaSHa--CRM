import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  Calendar,
  Briefcase,
  Users,
  CheckSquare,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      title: "Главная",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Проекты",
      href: "/projects",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      title: "Задачи",
      href: "/tasks",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      title: "Календарь",
      href: "/calendar",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Сотрудники",
      href: "/employees",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "??";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`;
  };

  return (
    <>
      <div className="bg-[#1e3a5a] text-white h-14 md:h-16 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-white mr-2 md:hidden"
            onClick={toggleMenu}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <Link href="/">
            <a className="text-xl font-bold flex items-center">
              <span className="hidden md:inline">Фитнес Трекер</span>
              <span className="md:hidden">ФТ</span>
            </a>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          {user && (
            <>
              <Link href="/profile">
                <a className="flex items-center">
                  <Avatar className="h-8 w-8 bg-blue-500">
                    <AvatarImage src={user.avatar || ""} alt={user.username} />
                    <AvatarFallback>
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 hidden md:inline">
                    {user.firstName || user.username}
                  </span>
                </a>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={toggleMenu}
      ></div>

      <div
        className={`fixed top-14 left-0 bottom-0 w-64 bg-[#1e3a5a] text-white z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:top-16 md:w-64 md:z-30`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 py-4">
            <ul className="space-y-1 px-2">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={`flex items-center px-4 py-3 rounded-md hover:bg-[#2c4d6e] transition-colors ${
                        location === item.href ? "bg-[#2c4d6e]" : ""
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.title}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-[#2c4d6e]">
            <Link href="/profile">
              <a className="flex items-center px-4 py-3 rounded-md hover:bg-[#2c4d6e] transition-colors">
                <User className="h-5 w-5" />
                <span className="ml-3">Мой профиль</span>
              </a>
            </Link>
            <button
              className="w-full flex items-center px-4 py-3 rounded-md hover:bg-[#2c4d6e] transition-colors mt-2"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Выйти</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-14 md:pt-16 md:pl-64">
        <main className="min-h-screen bg-gray-50">{/* Content goes here */}</main>
      </div>
    </>
  );
} 