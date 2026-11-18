#!/bin/sh
# E13 composite with the per-room fixes found on review
export MOVE_r08="158,78,0,-2.4;157.5,86.7,0,-3.5;157,95,0,-4.3;155.2,109.8,0,0.6"
export CABLE_r08="160.25,77.9,159.9,75.5;160.25,87.1,159.6,83.3;160.0,95.25,159.0,90.9;162.4,96.35,163.1,97.2"
export MOVE_r04="70.5,65.5,-3.2,-1.5"
export LANES_SKIP=r05          # only the study rug reaches its lane; a rug is floor, not furniture
python3 e13comp.py ret "$@"
