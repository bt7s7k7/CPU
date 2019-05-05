# CPU
This is a virtual CPU simulated in JavaScript available at https://bt7s7k7.github.io/CPU/.  
## Instructions
````js
nop: { code: 0, args: [] },                        // Does nothing
jmp: { code: 1, args: ["$target"] },               // Jumps to $target
hlt: { code: 2 },                                  // Stop clock
										           
cout: { code: 3, args: ["#value"] },               // Outputs #value
aout: { code: 4 },                                 // Outputs A
inp: { code: 32 },                                 // Inputs A
iot: { code: 38, args: ["#target"] },              // Changes I/O target to #target
										           
atb: { code: 5 },				   // \ 
bta: { code: 6 },				   //  |
atx: { code: 7 },				   //  |
aty: { code: 8 },				   //  |
xta: { code: 9 },				   //  |
yta: { code: 10 },				   //   > Move [] to []
btx: { code: 11 },				   //  |
bty: { code: 12 },				   //  |
xtb: { code: 13 },				   //  |
ytb: { code: 14 },				   //  |
xty: { code: 15 },				   //  |
ytx: { code: 16 },				   // /
										           
loa: { code: 17, args: ["#value"] },               // Sets A to #value
lob: { code: 18, args: ["#value"] },	           // Sets B to #value
lox: { code: 19, args: ["#value"] },	           // Sets X to #value
loy: { code: 20, args: ["#value"] },	           // Sets Y to #value
rsb: { code: 23 },			           // Sets B to 0
										           
sum: { code: 21 },	                           // A = A + B
sub: { code: 36 },                                 // A = A - B
add: { code: 22, args: ["#value"] },	           // A += #value
rem: { code: 37, args: ["#value"] },	           // A -= #value
										           
jpz: { code: 24, args: ["$target"] },	           // Jumps to $target if zero
jnz: { code: 25, args: ["$target"] },	           // Jumps to $target if not zero
jpc: { code: 26, args: ["$target"] },	           // Jumps to $target if carry
jnc: { code: 27, args: ["$target"] },	           // Jumps to $target if not carry
jpa: { code: 33 },		                   // Jumps to A
										           
rrd: { code: 28, args: ["$address"] },             // A = *$address
wrt: { code: 29, args: ["$address"] },             // *$address = A
ldd: { code: 30 },			           // A = *B
set: { code: 31 },			           // *B = A
cnst: { code: 34, args: ["#value", "$address"] },  // *$addresss = #value
mov: { code: 35, args: ["$source", "$target"] },   // *$target = *$source
````

## Assembler

CPU also features an assembler. It manages all memory locations for you. 
Example:
````
/ Use slashes to create a comment.
Comments can span multiple lines. /
/Use $ to define a variable/
cnst 50 $number
mov $number $secondNumber
/ Use : to insert a label address /
jmp :continue
hlt
/ Use :: to define a label /
::continue
rrd $secondNumber
aout
/ Use "" to define a string and insert it's adress.
A 0 will be inserted at the end of the string./
cnst "Hello world!" $string
rrd $string
atb
ldd
aout
hlt
````