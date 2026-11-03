# Reflection

## What We built

For Module 5 we built an interactive page that explains what a compressor does to start out, and then how you can exploit the cool, but potentially vulnerable compression feature can do. This page shows how compressed requests and files can be used to abstract important information. It also shows how ZIP bombs can get out of control with an algorithmic-complexity. Then, it closes with different methods to combat these common exploits, a time line, and a short quiz.

## How it deepened my understanding

We liked the interactivity of the page. Before doing this project (and learning in class), we had a good idea of how compression worked and what ZIP bombs do. Stage 1 deepened my understanding of how you can use the size of a compressed request to guess the cookie token by choosing the character that makes the request the smallest. Although we knew about ZIP files, it was also interesting to learn about the Non-recursive ZIP files and the Nested, 42.zip style of the files and how changing certain values can lead to a crazy decompression size compared to the compressed size. Also, we learned more about the ways to shut the attacks down by disabling compression or separating the secret. We thought it was helpful to use the same format introduced earlier to show not only how those two methods work, but defend against an attack by making all of the potential cookie token candidates have the same size when entered so guessing them will not show an attacker anything. Then, we learned how good extractors check the expansion ratio and the max output a compressed file after every little extraction to make sure it doesn't write out a enormous amount of bytes. It ends with some references, a timeline which can be helpful. Lastly, we tested our learning with a quiz.

## Workflow

1. We wanted to focus on more research first so we prompted Claude to find good papers/articles that were related to this topic that would be the reference for this site. We checked them and then used that information to build the page with Claude Code.
2. All the logic lives in three small files (`src/sim/lz77.ts`, `crime.ts`, `bombs.ts`) with unit tests that check the page's claims.
3. We did not have any real backend, we just made simulations that mimicked an actual attack on a server or on a computer .
4. We used Claude Code to scaffold the Vite + React + TypeScript project and write the components, describing the labs and interactivity I wanted.
5. For review, we went through each part and checked it based on the sources cited in the page. I also have tests run automatically for the page itself.

## Takeaway

We have to be careful with compressed files. We are only going to extract them from trusted sources and use good extractors that do not have a naive approach. We also learned something interesting about using compression to guess the cookie token. When making systems in the future, we are going to be careful when it comes to compressed requests and with handling compressed files within our app to protect users.
