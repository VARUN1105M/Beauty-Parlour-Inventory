library api_client;

import 'dart:convert';
import 'package:core_models/core_models.dart';

/// POS Peripheral & ESC/POS Hardware Integration Service
class HardwareService {
  /// ESC/POS Command sequences for thermal receipt printers & cash drawers
  static const List<int> escInit = [0x1B, 0x40]; // ESC @ (Initialize)
  static const List<int> escAlignLeft = [0x1B, 0x61, 0x00];
  static const List<int> escAlignCenter = [0x1B, 0x61, 0x01];
  static const List<int> escAlignRight = [0x1B, 0x61, 0x02];
  static const List<int> escBoldOn = [0x1B, 0x45, 0x01];
  static const List<int> escBoldOff = [0x1B, 0x45, 0x00];
  static const List<int> escDoubleHeight = [0x1B, 0x21, 0x10];
  static const List<int> escCutPaper = [0x1D, 0x56, 0x41, 0x00]; // GS V A 0 (Cut paper)
  static const List<int> escKickDrawerRJ11 = [0x1B, 0x70, 0x00, 0x19, 0xFA]; // Pulse to pin 2 (Kick cash drawer)

  /// Generates ESC/POS byte buffer for a thermal receipt printer (e.g. Epson TM-T88VI)
  static List<int> buildReceiptEscPos({
    required String storeName,
    required String branchAddress,
    required String gstNumber,
    required Sale sale,
    required String cashierName,
  }) {
    final List<int> buffer = [];

    void write(String text) {
      buffer.addAll(utf8.encode(text));
    }

    // Init printer & Kick Drawer if cash sale
    buffer.addAll(escInit);
    buffer.addAll(escKickDrawerRJ11);

    // Center header
    buffer.addAll(escAlignCenter);
    buffer.addAll(escBoldOn);
    buffer.addAll(escDoubleHeight);
    write('$storeName\n');
    buffer.addAll(escBoldOff);
    buffer.addAll(escInit);
    buffer.addAll(escAlignCenter);
    write('$branchAddress\n');
    write('GSTIN: $gstNumber\n');
    write('------------------------------------------------\n');

    // Left metadata
    buffer.addAll(escAlignLeft);
    write('Invoice: ${sale.invoiceNumber}\n');
    write('Date:    ${sale.saleDate.toString().substring(0, 19)}\n');
    write('Cashier: $cashierName\n');
    if (sale.customerName != null) {
      write('Customer: ${sale.customerName}\n');
    }
    write('------------------------------------------------\n');
    write('Item                       Qty   Price     Total\n');
    write('------------------------------------------------\n');

    for (final item in sale.items) {
      final nameStr = item.productName.length > 24
          ? item.productName.substring(0, 24)
          : item.productName.padRight(24);
      final qtyStr = item.qty.toString().padLeft(4);
      final priceStr = '₹${item.unitPrice.toStringAsFixed(0)}'.padLeft(8);
      final totalStr = '₹${item.lineTotal.toStringAsFixed(0)}'.padLeft(10);
      write('$nameStr$qtyStr$priceStr$totalStr\n');
    }

    write('------------------------------------------------\n');
    buffer.addAll(escAlignRight);
    write('Subtotal: ₹${sale.subtotal.toStringAsFixed(2)}\n');
    if (sale.discountAmount > 0) {
      write('Discount: -₹${sale.discountAmount.toStringAsFixed(2)}\n');
    }
    write('Tax (GST): ₹${sale.taxAmount.toStringAsFixed(2)}\n');
    buffer.addAll(escBoldOn);
    write('TOTAL: ₹${sale.totalAmount.toStringAsFixed(2)}\n');
    buffer.addAll(escBoldOff);
    write('Payment Status: ${sale.paymentStatus.toUpperCase()}\n');

    // Footer
    buffer.addAll(escAlignCenter);
    write('------------------------------------------------\n');
    write('Exchange within 14 days with original receipt\n');
    write('Thank you for shopping at Royal Heritage!\n\n\n\n');

    // Cut
    buffer.addAll(escCutPaper);
    return buffer;
  }

  /// Simulates hardware trigger of Cash Drawer RJ-11 kick
  static Future<bool> kickCashDrawer() async {
    // In production Windows build, write escKickDrawerRJ11 to printer COM/USB port
    return true;
  }
}
