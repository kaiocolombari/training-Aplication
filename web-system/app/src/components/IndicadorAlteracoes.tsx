
// import { useAvaliacao } from "../context/avaliacaoContext";
// import {
//     BsCloudCheck,
//     BsCloudArrowUp,
// } from "react-icons/bs";

// export default function IndicadorAlteracoes() {
//     const { alteracoesPendentes } = useAvaliacao();
//     console.log("INDICADOR RENDERIZADO");
//     return (
//         <div
//             className={`
//                 fixed bottom-5 right-5 z-[9999]
//                 flex items-center gap-3
//                 rounded-xl border
//                 px-4 py-3
//                 shadow-lg
//                 backdrop-blur-md
//                 transition-all duration-300
//                 ${
//                     alteracoesPendentes
//                         ? "border-amber-500/30 bg-amber-500/10"
//                         : "border-emerald-500/30 bg-emerald-500/10"
//                 }
//             `}
//         >
//             {alteracoesPendentes ? (
//                 <>
//                     <BsCloudArrowUp
//                         className="shrink-0 text-amber-500"
//                         size={22}
//                     />

//                     <div>
//                         <p className="text-sm font-semibold text-[var(--text-primary)]">
//                             Alterações pendentes
//                         </p>

//                         <p className="text-xs text-[var(--text-secondary)]">
//                             Modificações não confirmadas
//                         </p>
//                     </div>
//                 </>
//             ) : (
//                 <>
//                     <BsCloudCheck
//                         className="shrink-0 text-emerald-500"
//                         size={22}
//                     />

//                     <div>
//                         <p className="text-sm font-semibold text-[var(--text-primary)]">
//                             Tudo em dia
//                         </p>

//                         <p className="text-xs text-[var(--text-secondary)]">
//                             Nenhuma alteração pendente
//                         </p>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// }
