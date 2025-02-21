from manim import *
import networkx as nx
import random


class NetworkSpread(Scene):
    def construct(self):
        G = nx.erdos_renyi_graph(50, 0.1, seed=42)

        vertices = list(G.nodes)
        edges = list(G.edges)

        graph = Graph(
            vertices,
            edges,
            layout="spring",
            layout_scale=3,
            vertex_config={"fill_color": GRAY, "radius": 0.1},
        )

        self.play(Create(graph))

        start_node = vertices[0]

        infected_nodes = [start_node]
        self.play(graph[start_node].animate.set_color(ORANGE))

        while len(infected_nodes) < len(vertices):
            to_animate_this_time = []
            edges_to_animate_this_time = []

            for infected_node in infected_nodes[:]:
                for node in G.nodes:
                    is_an_edge = (node, infected_node) in edges or (
                        infected_node,
                        node,
                    ) in edges

                    is_randomly_selected = random.randint(0, 100) < 40

                    if (
                        (is_an_edge)
                        and node not in infected_nodes
                        and is_randomly_selected
                    ):
                        infected_nodes.append(node)

                        if (node, infected_node) in edges:
                            edges_to_animate_this_time.append((node, infected_node))
                        elif (infected_node, node) in edges:
                            edges_to_animate_this_time.append((infected_node, node))

                        to_animate_this_time.append(node)

            if edges_to_animate_this_time:
                self.play(
                    *[
                        graph.edges[edge].animate.set_color(ORANGE)
                        for edge in edges_to_animate_this_time
                    ]
                )
            if to_animate_this_time:
                self.play(
                    *[graph[n].animate.set_color(ORANGE) for n in to_animate_this_time]
                )

        self.wait(2)
