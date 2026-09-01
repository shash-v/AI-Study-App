// import React from 'react'
// import ReactDOM from 'react-dom'
// import { getCurrentWindow } from '@tauri-apps/api/window'

// interface UploadDashboardWrapperProps {
//   isUploadMode: boolean
//   onClose: () => void
//   children: React.ReactNode
// }

// export const UploadDashboardWrapper: React.FC<UploadDashboardWrapperProps> = ({
//   isUploadMode,
//   onClose,
//   children,
// }) => {
//   const handleMouseDown = async (e: React.MouseEvent) => {
//     if (!isUploadMode) return
//     if ((e.target as HTMLElement).closest('button, input, select, textarea')) return

//     try {
//       await getCurrentWindow().startDragging()
//     } catch (error) {
//       console.error('Failed to drag window:', error)
//     }
//   }

//   const content = (
//     <div
//       onMouseDown={handleMouseDown}
//       style={{
//         position: isUploadMode ? 'fixed' : 'relative',
//         top: isUploadMode ? '50%' : 0,
//         left: isUploadMode ? '50%' : 0,
//         transform: isUploadMode ? 'translate(-50%, -50%)' : 'none',
//         width: isUploadMode ? '1100px' : '100%',
//         height: isUploadMode ? '750px' : '100%',
//         backgroundColor: isUploadMode ? 'rgba(20, 20, 20, 0.95)' : 'inherit',
//         backdropFilter: isUploadMode ? 'blur(16px)' : 'none',
//         borderRadius: isUploadMode ? '20px' : '0px',
//         border: isUploadMode ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
//         zIndex: isUploadMode ? 9999 : 1,
//         display: 'flex',
//         flexDirection: 'column',
//         boxSizing: 'border-box',
//         overflow: 'hidden',
//         cursor: isUploadMode ? 'grab' : 'default',
//         userSelect: 'none',
//         boxShadow: isUploadMode ? '0 20px 40px rgba(0,0,0,0.6)' : 'none',
//       }}
//     >
//       {isUploadMode && (
//         <div
//           style={{
//             display: 'flex',
//             justifyContent: 'flex-end',
//             padding: '16px 20px 0',
//           }}
//         >
//           <button
//             type="button"
//             title="Close Dashboard"
//             onClick={onClose}
//             style={{
//               all: 'unset',
//               cursor: 'pointer',
//               color: 'rgba(255, 255, 255, 0.7)',
//               fontSize: '0.85rem',
//               fontWeight: 500,
//               padding: '6px 12px',
//               borderRadius: '9999px',
//               backgroundColor: 'rgba(255, 255, 255, 0.05)',
//               border: '1px solid rgba(255, 255, 255, 0.1)',
//               transition: 'all 0.2s ease',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '4px',
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
//               e.currentTarget.style.color = '#ffffff'
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
//               e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
//             }}
//           >
//             Close &times;
//           </button>
//         </div>
//       )}
//       {children}
//     </div>
//   )

//   if (isUploadMode) {
//     return ReactDOM.createPortal(content, document.body)
//   }

//   return content
// }