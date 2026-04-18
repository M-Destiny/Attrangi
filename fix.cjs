const fs = require('fs');
let code = fs.readFileSync('check-and-seed.ts', 'utf8');
// Remove " Pin" from names
code = code.replace(/ Pin"/g, '"');
// Modify the if-else to update the name
code = code.replace(/} else \{\s*console\.log\(`Product already exists: \$\{product\.name\}`\);\s*\}/, `} else {
      const { error: updateError } = await supabase.from('products').update({ name: product.name }).eq('sku', product.sku);
      if (updateError) {
         console.error('Error updating product:', updateError.message);
      } else {
         console.log(\`Updated: \$\{product.name\}\`);
      }
    }`);
fs.writeFileSync('check-and-seed.ts', code);
