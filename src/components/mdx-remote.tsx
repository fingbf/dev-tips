import { MDXRemote as MDXRemoteBase } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { CodeBlock } from "./code-block";

type Props = {
  source: string;
};

const components = {
  pre: CodeBlock,
};

export function MDXRemote({ source }: Props) {
  return (
    <MDXRemoteBase
      source={source}
      components={components}
      options={{
        mdxOptions: {
          rehypePlugins: [
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: "github-dark",
                  light: "github-light",
                },
                keepBackground: false,
              },
            ],
          ],
        },
      }}
    />
  );
}
