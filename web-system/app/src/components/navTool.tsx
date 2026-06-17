import { tabs } from '../routes/tabRoutes'
import { NavLink } from 'react-router'

export default function navTool() {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex border-b border-zinc-500 bg-[#2f2f2f]">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.rota}
                        to={tab.rota}
                        className={({ isActive }) =>
                            ` px-5 py-2 text-sm font-semibold uppercase border-r border-zinc-500 transition
                ${isActive
                                ? "bg-white text-[#4c8b72]"
                                : "bg-[#2f2f2f] text-white hover:bg-[#444]"
                            } `
                        }
                    >
                        {tab.nome}
                    </NavLink>
                ))}
            </div>
        </div>
    )
}