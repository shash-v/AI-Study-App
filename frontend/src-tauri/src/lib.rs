// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//   tauri::Builder::default()
//     .setup(|app| {
//       if cfg!(debug_assertions) {
//         app.handle().plugin(
//           tauri_plugin_log::Builder::default()
//             .level(log::LevelFilter::Info)
//             .build(),
//         )?;
//       }
//       Ok(())
//     })
//     .run(tauri::generate_context!())
//     .expect("error while running tauri application");
// }

use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use std::thread;
use std::time::Duration;


fn toggle_panel(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);

        if is_visible {
            // Slide Out (Right -> Off-screen)
            if let Ok(Some(monitor)) = window.current_monitor() {
                let screen_width = monitor.size().width as i32;
                let window_size = window.outer_size().unwrap_or(PhysicalSize::new(380, 720));
                let current_y = window.outer_position().map(|p| p.y).unwrap_or(40);
                let start_x = screen_width - window_size.width as i32;
                
                let steps = 15;
                for i in 0..=steps {
                    let progress = i as f32 / steps as f32;
                    let current_x = start_x + (window_size.width as f32 * progress) as i32;
                    let _ = window.set_position(PhysicalPosition::new(current_x, current_y));
                    thread::sleep(Duration::from_millis(8));
                }
            }
            let _ = window.hide();
        } else {
            let _ = window.set_shadow(false); // Prevents square OS shadow glitches behind rounded corners
            // Position on right screen edge and Slide In
            if let Ok(Some(monitor)) = window.current_monitor() {
                let screen_size = monitor.size();
                let screen_width = screen_size.width as i32;
                
                // Set explicit panel dimensions (e.g., 380x720)
                let window_width = 380;
                let window_height = 720;

                // Center vertically or offset slightly from the top edge
                let target_y = ((screen_size.height as i32 - window_height as i32) / 2).max(20);

                let _ = window.set_size(PhysicalSize::new(window_width as u32, window_height as u32));
                let start_x = screen_width;

                // Move offscreen at target Y position before showing
                let _ = window.set_position(PhysicalPosition::new(start_x, target_y));
                let _ = window.show();
                let _ = window.set_focus();

                // Slide animation loop
                let steps = 15;
                for i in 0..=steps {
                    let progress = i as f32 / steps as f32;
                    let ease = 1.0 - (1.0 - progress).powi(2);
                    let current_x = start_x - ((window_width as f32) * ease) as i32;
                    
                    let _ = window.set_position(PhysicalPosition::new(current_x, target_y));
                    thread::sleep(Duration::from_millis(8));
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let screen_size = monitor.size();
                    let screen_width = screen_size.width as i32;
                    let window_width = 380;
                    let window_height = 720;
                    let target_y = ((screen_size.height as i32 - window_height as i32) / 2).max(20);

                    let _ = window.set_size(PhysicalSize::new(window_width as u32, window_height as u32));
                    let _ = window.set_position(PhysicalPosition::new(
                        screen_width - window_width,
                        target_y,
                    ));
                }
            }

            let app_handle = app.handle().clone();

            app.global_shortcut().on_shortcut("Ctrl+Shift+Q", move |_app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    toggle_panel(&app_handle);
                }
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}