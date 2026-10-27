# Hardware Integration Architecture & Protocols

This document details peripheral integration for the Windows Desktop POS application.

## 1. Receipt Printer (Epson TM-T88VI Thermal)
- **Interface**: USB (Virtual COM Port) or direct Win32 Spooler API (`RawPrinterHelper`).
- **Command Set**: ESC/POS.
- **Key Byte Sequences**:
  - `0x1B 0x40`: Initialize printer (`ESC @`)
  - `0x1B 0x61 0x01`: Center alignment
  - `0x1B 0x45 0x01`: Bold font ON
  - `0x1B 0x45 0x00`: Bold font OFF
  - `0x1D 0x56 0x41 0x00`: Full paper cut (`GS V A 0`)

## 2. Cash Drawer (APG Vasario RJ-11)
- **Interface**: Standard RJ-11 connector plugged directly into the Receipt Printer's `DK` (Drawer Kick) port.
- **Trigger**: ESC/POS pulse sent to the printer during cash transactions.
- **Command Sequence**: `0x1B 0x70 0x00 0x19 0xFA` (`ESC p 0 25 250` - generates 50ms pulse on pin 2).
- **Audit Monitoring**: The printer driver reports drawer open/close status back to the desktop application for cash security audit logging.

## 3. Barcode / QR Scanner (Honeywell 1900g USB)
- **Interface**: USB HID Keyboard Emulation.
- **Operation**: The scanner reads the 1D/2D barcode and outputs characters followed by an enter (`CR`/`LF`) delimiter.
- **Software Integration**:
  - Global hotkey listener or focused barcode input field.
  - Automatic lookup against `products.barcode`, `products.sku`, or `inventory_units.unique_tag`.

## 4. Card Reader / POS Terminal (Ingenico / Pax / Verifone)
- **Interface**: USB / Ethernet API or Local Web Payment Hook.
- **Workflow**:
  1. Desktop app transmits transaction amount + currency.
  2. Terminal prompts customer to insert/tap card or scan BharatQR/UPI.
  3. Terminal sends transaction authorization code and card last 4 digits back to POS.
  4. POS attaches `transaction_ref` to payment record and completes checkout.

## 5. Jewellery Tag / Label Printer (Zebra GK420d)
- **Interface**: USB EPL/ZPL.
- **Operation**: Generates small butterfly jewellery barcode labels with Product Name, Gross Weight, Net Weight, Karat Purity, and unique serial barcode.
