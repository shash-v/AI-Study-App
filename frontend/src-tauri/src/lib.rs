use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use std::thread;
use std::time::Duration;

fn toggle_panel(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);

        if is_visible {
            let current_size = window.inner_size().unwrap_or(PhysicalSize::new(380, 720));
            let is_large = current_size.width > 800;

            if is_large {
                let _ = window.hide();
            } else {
                // Slide Out (Right -> Off-screen) for small panel mode
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let screen_width = monitor.size().width as i32;
                    let window_size = window.outer_size().unwrap_or(PhysicalSize::new(380, 720));
                    let current_y = window.outer_position().map(|p| p.y).unwrap_or(40);
                    let start_x = monitor.position().x + screen_width - window_size.width as i32;
                    
                    let steps = 15;
                    for i in 0..=steps {
                        let progress = i as f32 / steps as f32;
                        let current_x = start_x + (window_size.width as f32 * progress) as i32;
                        let _ = window.set_position(PhysicalPosition::new(current_x, current_y));
                        thread::sleep(Duration::from_millis(8));
                    }
                }
                let _ = window.hide();
            }
        } else {
            let current_size = window.inner_size().unwrap_or(PhysicalSize::new(380, 720));
            let is_large = current_size.width > 800;

            if let Ok(Some(monitor)) = window.current_monitor() {
                let screen_size = monitor.size();
                let screen_width = screen_size.width as i32;
                let screen_height = screen_size.height as i32;
                let monitor_x = monitor.position().x;
                let monitor_y = monitor.position().y;

                if is_large {
                    let window_width = 1200;
                    let window_height = 800;
                    let target_x = monitor_x + (screen_width - window_width) / 2;
                    let target_y = monitor_y + (screen_height - window_height) / 2;

                    // Instantly set size/position while hidden, then show seamlessly
                    let _ = window.set_size(PhysicalSize::new(window_width as u32, window_height as u32));
                    let _ = window.set_position(PhysicalPosition::new(target_x, target_y));
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    let _ = window.set_shadow(false);
                    let window_width = 380;
                    let window_height = 720;
                    let target_y = monitor_y + ((screen_height - window_height) / 2).max(20);

                    let _ = window.set_size(PhysicalSize::new(window_width as u32, window_height as u32));
                    let start_x = monitor_x + screen_width;

                    let _ = window.set_position(PhysicalPosition::new(start_x, target_y));
                    let _ = window.show();
                    let _ = window.set_focus();

                    let _ = window.emit("reset-large-mode", ());

                    let steps = 15;
                    for i in 0..=steps {
                        let progress = i as f32 / steps as f32;
                        let ease = 1.0 - (1.0 - progress).powi(2);
                        let current_x = (monitor_x + screen_width) - ((window_width as f32) * ease) as i32;
                        
                        let _ = window.set_position(PhysicalPosition::new(current_x, target_y));
                        thread::sleep(Duration::from_millis(8));
                    }
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
                    let target_y = monitor.position().y + ((screen_size.height as i32 - window_height as i32) / 2).max(20);

                    let _ = window.set_size(PhysicalSize::new(window_width as u32, window_height as u32));
                    let _ = window.set_position(PhysicalPosition::new(
                        monitor.position().x + screen_width - window_width,
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