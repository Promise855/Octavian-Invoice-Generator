document.addEventListener('DOMContentLoaded', function() {
    const addItemBtn = document.getElementById('addItem');
    const itemRows = document.getElementById('itemRows');
    let serialNumber = 1;

    // Add new item row
    addItemBtn.addEventListener('click', function() {
        if (serialNumber > 20) {
            alert("Maximum limit of 20 rows reached!");
            return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="sn" value="${serialNumber}" readonly></td>
            <td><input type="text" name="name" required></td>
            <td><input type="text" name="description" required></td>
            <td><input type="text" name="itemSN"></td>
            <td><input type="number" name="qty" min="1" required></td>
            <td><input type="text" name="unitPrice" required></td>
            <td><input type="number" name="discount" min="0" max="100" step="0.01"></td>
            <td><input type="text" name="amount" readonly></td>
            <td><button type="button" class="removeItem">Remove</button></td>
        `;
        itemRows.appendChild(row);
        serialNumber++; // Increment serial number for the next row

        // Add event listener for remove button
        row.querySelector('.removeItem').addEventListener('click', function () {
            row.remove();
            updateSerialNumbers(); 
            updateTotals();
        });

        // Add event listeners for real-time calculations
        const inputs = row.querySelectorAll('input[name="qty"], input[name="unitPrice"], input[name="discount"]');
        inputs.forEach(input => input.addEventListener('input', calculateAmount));
    });

    // Function to update serial numbers after deletion
    function updateSerialNumbers() {
        const rows = itemRows.querySelectorAll('tr');
        let newSerial = 1;

        rows.forEach(row => {
            const snInput = row.querySelector('input[name="sn"]');
            if (snInput) {
                snInput.value = newSerial++;
            }
        });

        // Update serialNumber to the next available number
        serialNumber = newSerial;
    }

    // Calculate amount for an item
    function calculateAmount(event) {
        const row = event.target.closest('tr');
        const qty = parseFloat(row.querySelector('input[name="qty"]').value) || 0;
        const unitPrice = parseFloat(row.querySelector('input[name="unitPrice"]').value) || 0;
        const discount = parseFloat(row.querySelector('input[name="discount"]').value) || 0;
        const discountAmount = (unitPrice * discount) / 100;
        const amount = qty * (unitPrice - discountAmount);

        row.querySelector('input[name="amount"]').value = amount.toFixed(2);
        updateTotals();
    }

    // Function to update totals
    function updateTotals() {
        const rows = itemRows.querySelectorAll('tr');
        let itemQty = 0, subTotal = 0, total = 0;

        rows.forEach(row => {
            const qtyElement = row.querySelector('input[name="qty"]');
            const qty = qtyElement ? parseFloat(qtyElement.value) || 0 : 0;
            const unitPrice = parseFloat(row.querySelector('input[name="unitPrice"]')?.value) || 0;
            const discount = parseFloat(row.querySelector('input[name="discount"]')?.value) || 0;

            itemQty += qty;
            subTotal += qty * unitPrice;
            total += (qty * unitPrice) * (1 - discount / 100);
        });

        document.getElementById('itemQty').textContent = itemQty;
        document.getElementById('subTotal').textContent = subTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('total').textContent = total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('amountInWords').textContent = numberToWords(total);
    }

    // Convert number to words (Naira & Kobo)
    function numberToWords(num) {
        if (num === 0) return "Zero Naira";
    
        const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
        const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const scales = ["", "Thousand", "Million", "Billion"];

        function convertGroupToWords(num) {
            let words = [];
            if (num >= 100) {
                words.push(units[Math.floor(num / 100)] + " Hundred And");
                num %= 100;
            }
            if (num >= 20) {
                words.push(tens[Math.floor(num / 10)]);
                num %= 10;
            } else if (num >= 10) {
                words.push(teens[num - 10]);
                num = 0;
            }
            if (num > 0) words.push(units[num]);
            return words.join(" ");
        }

        let [integerPart, decimalPart] = num.toFixed(2).split(".");
        integerPart = parseInt(integerPart, 10);
        decimalPart = parseInt(decimalPart, 10);
    
        let words = [];
        let scaleIndex = 0;
    
        while (integerPart > 0) {
            let group = integerPart % 1000;
            if (group > 0) {
                let groupWords = convertGroupToWords(group);
                if (scaleIndex > 0) groupWords += " " + scales[scaleIndex];
                words.unshift(groupWords);
            }
            integerPart = Math.floor(integerPart / 1000);
            scaleIndex++;
        }
    
        let integerWords = words.join(" ");
        let decimalWords = decimalPart > 0 ? convertGroupToWords(decimalPart) + " Kobo" : "";
    
        return decimalWords
            ? integerWords + " Naira and " + decimalWords
            : integerWords + " Naira";
    }

    document.getElementById('receiptForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission
    
        // Collect customer details
        const customerName = document.getElementById('customerName').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const invoiceNo = document.getElementById('invoiceNumber').value;
        const date = document.getElementById('date').value;
    
        // Collect item details
        const rows = document.querySelectorAll('#itemRows tr');
        let items = [];
        let itemQty = 0, subTotal = 0, total = 0;
    
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('td input');
            if (inputs.length < 6) return;
    
            const sn = inputs[0].value; // Not used, just for clarity
            const name = inputs[1].value;
            const description = inputs[2].value;
            const itemSN = inputs[3].value;
            const qty = parseInt(inputs[4].value) || 0;
            const unitPrice = parseFloat(inputs[5].value) || 0;
            const discount = parseFloat(inputs[6].value) || 0;
            const amount = (qty * unitPrice) * (1 - discount / 100);
            items.push({ sn: index + 1, name, description, itemSN, qty, unitPrice, discount, amount });
            itemQty += qty;
            subTotal += qty * unitPrice;
            total += amount;
        });
    
        const paymentMode = document.getElementById('paymentMode').value;
        const amountInWords = numberToWords(total);
    
        // Store receipt data in localStorage
        const invoiceNumber = document.getElementById('invoiceNumber').value;
        const receiptData = {
            customerName,
            phoneNumber,
            invoiceNumber, // Fixed from invoiceNo
            date,
            items,
            itemQty,
            subTotal,
            total,
            paymentMode,
            amountInWords
        };
        localStorage.setItem('receiptData', JSON.stringify(receiptData));
    
        // Open receipt.html in a new tab
        window.open('receipt.html', '_blank');
    });
    

});
